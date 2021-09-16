import React, { useRef } from "react";
import "./App.css";

import "firebase/firestore";
import "firebase/auth";

// messy imports, was just playing around with stuff
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, query, onSnapshot } from "firebase/firestore";

//Table imports
import BootstrapTable from "react-bootstrap-table-next";
import "bootstrap/dist/css/bootstrap.css";

const config = require("./config.json");

// find in firebase ... will set up secrets later
initializeApp(config.firebaseConfig);

const auth = getAuth();
const firestore = getFirestore();

function App() {
  const [user] = useAuthState(auth);

  const ingredientID = useRef(null);
  const recipeName = useRef(null);

  if (user) {
    return (
      <div className="App">
        <header className="App-header">Food Fanatic{user ? <SignOut /> : <SignIn />}</header>
        <div className="container">
          {/* <Recipes /> */}
          <Ingredients />
          <input className="e-input" type="text" placeholder="Enter Fdcid" ref={ingredientID} />
          <button onClick={() => addIngredientToCloud(ingredientID)}> Add New Ingredient</button>
          <br />
          <input className="e-input" type="text" placeholder="Enter name of Recipe" ref={recipeName} />
          <button onClick={() => addRecipeToCloud(recipeName)}> Add New Recipe</button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="App">
        <header className="App-header">
          Food Fanatic <SignIn />
        </header>
        <p>Sign In to View Recipes</p>
      </div>
    );
  }
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return <button onClick={signInWithGoogle}>Sign in with Google</button>;
}

function SignOut() {
  return auth.currentUser && <button onClick={() => auth.signOut()}>Sign Out</button>;
}

async function getRecipes() {
  const querySnapshot = await getDocs(collection(firestore, "users", auth.currentUser.uid, "recipes"));
  let recipes = [];
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    recipes.push({ id: doc.id, data: doc.data() });
  });
  return recipes;
}

const getUserIngredients = () => {
  const q = query(collection(firestore, "users", auth.currentUser.uid, "ingredients"));
  let ingredients = [];
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      let docData = doc.data();
      ingredients.push({ id: doc.id, name: docData.name, cal: docData.cal });
    });
  });
  return ingredients;
};

const getIngredientData = async (foodId) => {
  let res = await fetch(`${config.fdcConfig.url}/${foodId}?limit=1&api_key=${config.fdcConfig.apiKey}`);
  if (res.status !== 200) {
    return { name: null, cal: null };
  }
  res = await res.json();
  return res.labelNutrients
    ? { name: res.description, cal: res.labelNutrients.calories.value }
    : { name: res.description, cal: null };
};

const addRecipeToCloud = async () => {};

const addIngredientToCloud = async (ingredientID) => {
  let fdcID = ingredientID.current.value;
  getIngredientData(fdcID).then((ingredientData) => {
    if (ingredientData.name) {
      setDoc(doc(firestore, "users", auth.currentUser.uid, "ingredients", fdcID), ingredientData);
    }
    else alert("Please enter a valid ingredient");
  });
  ingredientID.current.value = "";
};

function Ingredients() {

  const q = query(collection(firestore, "users", auth.currentUser.uid, "ingredients"));
  const [userIngredients, setUserIngredients] = useState([]);
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    let ingredients = []
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      let docData = doc.data();
      ingredients.push({ id: doc.id, name: docData.name, cal: docData.cal });
    });
    setUserIngredients(ingredients);
  });

  const ingredient_columns = [
    { dataField: "name", text: "Ingredient Name" },
    { dataField: "cal", text: "Calories (kcal)" },
  ];
  const ingredientsTable = (
    <div id="Ingredients">
      <h1>Ingredients</h1>
      <BootstrapTable keyField="name" data={userIngredients} columns={ingredient_columns} />
    </div>
  );
  return ingredientsTable;
}

function Recipes() {
  let [recipes, setRecipes] = useState(null);
  let [fetchingRecipes, setFetchingRecipes] = useState(null);
  if (!fetchingRecipes) {
    setFetchingRecipes(1);
    getRecipes().then((recipes) => {
      const recipesTable = (
        <div id="recipes">
          <h1>Your Recipes</h1>
          <table id="recipesTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Calories</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((item) => (
                <tr key={item.id}>
                  <td>{item.data.name}</td>
                  <td>{item.data.cal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      setRecipes(recipesTable);
    });
  }
  return recipes;
}

export default App;
