import React, { useRef } from "react";
import "./App.css";

import "firebase/firestore";
import "firebase/auth";

// messy imports, was just playing around with stuff
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, query, onSnapshot, addDoc } from "firebase/firestore";

//Table imports
import BootstrapTable from "react-bootstrap-table-next";
import "bootstrap/dist/css/bootstrap.css";

//Camera import
import BarcodeScannerComponent from 'react-webcam-barcode-scanner';

const config = require("./config.json");

// find in firebase ... will set up secrets later
initializeApp(config.firebaseConfig);

const auth = getAuth();
const firestore = getFirestore();
const selectedIngredients = new Set();

function App() {
  const [user] = useAuthState(auth);

  const ingredientID = useRef(null);
  const recipeName = useRef(null);

  const [data, setData] = React.useState(null);
  const [bardata, setBarData] = React.useState('Not Found');

  React.useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setData(data.message));
  }, []);

  if (user) {
    return (
      <div className="App">
        <header className="App-header">Food Fanatic{user ? <SignOut /> : <SignIn />}</header>
        <div className="container">
          <Recipes />
          <Ingredients />
          <input className="e-input" type="text" placeholder="Enter name of Recipe" ref={recipeName} />
          <button onClick={() => addRecipeToCloud(recipeName)}> Add New Recipe</button>
          <br />
          <BarcodeScannerComponent width={500} height={500} onUpdate={(err, result) => {
          if (result) setBarData((result.text).slice(1,13)) }} />
          <p> Ingredient UPC: {bardata} </p>
          <button onClick={() => addIngredientToCloud(bardata)}> Add New Ingredient</button>
          <br />
          <p> Not Scanning? Enter UPC Manuallly Below: </p>
          <input className="e-input" type="text" placeholder="Enter UPC" onChange = {event => setBarData(event.target.value)} />
          <br />
          <p>{!data ? "Loading..." : data}</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="App">
        <header className="App-header">
          Food Fanatic <SignIn />
        </header>
        <p>Sign In to View Recipes and Ingredients</p>
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

const addRecipeToCloud = async (recipeName) => {
  if (!recipeName.current.value) {
    alert("Please enter a valid recipe name");
    return;
  }
  let totalCalories = 0;
  let ingredients = [];
  selectedIngredients.forEach((ingredient) => {
    if (ingredient.cal) totalCalories += ingredient.cal;
    ingredients.push(ingredient);
  });
  let recipeData = {
    name: recipeName.current.value,
    cal: totalCalories,
    ingredients: ingredients,
  };
  if (selectedIngredients.size > 0) addDoc(collection(firestore, "users", auth.currentUser.uid, "recipes"), recipeData);
  else alert("Please select ingredients to add to the recipe");
};

const addIngredientToCloud = async (upcID) => {
  //let fdcaID = 45001529;
  let res = await fetch(`${config.fdcConfig.url}api_key=${config.fdcConfig.apiKey}&query=${upcID}`);
  if (res.status !== 200){
    return null;
  }
  res = await res.json();
  let resFDCID = await fetch(`${config.fdcConfig.url2}/${res.foods[0].fdcId}?limit=1&api_key=${config.fdcConfig.apiKey}`);
  if (resFDCID.status !== 200){
    return null;
  }
  resFDCID = await resFDCID.json();
  var ingredientData = {name: resFDCID.description, cal: resFDCID.labelNutrients.calories.value};
  console.log(ingredientData);
    if (ingredientData.name) {
      setDoc(doc(firestore, "users", auth.currentUser.uid, "ingredients", upcID), ingredientData);
    } else alert("Please enter a valid ingredient");
  //ingredientID.current.value = "";
};

const makeIngredientsTable = (ingredients) => {
  const ingredient_columns = [
    { dataField: "name", text: "Ingredient Name" },
    { dataField: "cal", text: "Calories (kcal)" },
  ];

  const handleRowSelect = (row, isSelected, e) => {
    if (isSelected) {
      selectedIngredients.add(row);
    } else {
      selectedIngredients.forEach((ingredient) => {
        if (ingredient.id === row.id) selectedIngredients.delete(ingredient);
      });
    }
    console.log(selectedIngredients);
  };

  const selectRowProp = {
    mode: "checkbox",
    onSelect: handleRowSelect,
    hideSelectColumn: true,
    clickToSelect: true,
    bgColor: "rgb(238, 193, 213)",
  };

  const ingredientsTable = (
    <div id="Ingredients">
      <BootstrapTable selectRow={selectRowProp} keyField="name" data={ingredients} columns={ingredient_columns} />
    </div>
  );
  return ingredientsTable;
};

function Ingredients() {
  const [userIngredients, setUserIngredients] = useState([]);
  const q = query(collection(firestore, "users", auth.currentUser.uid, "ingredients"));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    let ingredients = [];
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      let docData = doc.data();
      ingredients.push({ id: doc.id, name: docData.name, cal: docData.cal });
    });
    setUserIngredients(ingredients);
  });
  return (
    <div>
      <h1>Ingredients</h1>
      {makeIngredientsTable(userIngredients)}
    </div>
  );
}

function Recipes() {
  const q = query(collection(firestore, "users", auth.currentUser.uid, "recipes"));
  const [userRecipes, setUserRecipes] = useState([]);
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    let recipes = [];
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      let docData = doc.data();
      recipes.push({ id: doc.id, name: docData.name, cal: docData.cal, ingredients: docData.ingredients });
    });
    setUserRecipes(recipes);
  });

  const recipesColumns = [
    { dataField: "name", text: "Recipe Name" },
    { dataField: "cal", text: "Total Calories (kcal)" },
  ];

  const expandRow = {
    renderer: (row) => makeIngredientsTable(row.ingredients),
  };

  const options = {
    expandRowBgColor: "rgb(242, 255, 163)",
  };

  const recipesTable = (
    <div id="Recipes">
      <h1>Recipes</h1>
      <BootstrapTable
        options={options}
        expandRow={expandRow}
        keyField="name"
        data={userRecipes}
        columns={recipesColumns}
      />
    </div>
  );
  return recipesTable;
}

export default App;
