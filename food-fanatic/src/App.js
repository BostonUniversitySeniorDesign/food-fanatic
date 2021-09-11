import React from "react";
import "./App.css";

import "firebase/firestore";
import "firebase/auth";

// messy imports, was just playing around with stuff
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const config = require("./config.json");

// find in firebase ... will set up secrets later
initializeApp(config.firebaseConfig);

const auth = getAuth();
const firestore = getFirestore();

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header className="App-header">Food Fanatic{user ? <SignOut /> : <SignIn />}</header>
      <section>{user ? <Recipes /> : <p>Sign In to View Recipes</p>}</section>
    </div>
  );
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

const getIngredientData = async () => {
  let foodId = 335929; // example food id for beans
  const response = await fetch(`${config.fdcConfig.url}/${foodId}?limit=1&api_key=${config.fdcConfig.apiKey}`);
  const jsonData = await response.json();
  return jsonData;
};

function Recipes() {
  let [recipes, setRecipes] = useState(null);
  // need to find a way to limit the amount of fetches cleanly...can't overload
  let [fetchingRecipes, setFetchingRecipes] = useState(null);
  if (!fetchingRecipes) {
    setFetchingRecipes(1);
    getRecipes().then((recipes) => {
      // trying out stuff with the API
      // getIngredientData().then((jsonData) => {console.log(jsonData)});
      const recipesTable = (
        <div id="recipes">
          <h1>Recipes</h1>
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
