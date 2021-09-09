import React from 'react';
import logo from './logo.svg';
import './App.css';

import 'firebase/firestore';
import 'firebase/auth';

// messy imports, was just playing around with stuff
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, query, orderBy, limit, getDocs, setDoc} from 'firebase/firestore';

// find in firebase ... will set up secrets later
initializeApp({
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
})

const auth = getAuth();
const firestore = getFirestore();

function App() {

  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header className="App-header">
      </header>
      <section>
        {user ? <Recipes /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }

  return (
    <button onClick={signInWithGoogle}>Sign in with Google</button>
  )
}

function SignOut() {
  return auth.currentUser && (
    <button onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function Recipes() {
  // trying some stuff out
  // const newCityRef = doc(collection(firestore, "users", auth.currentUser.uid, "recipes"));
  // setDoc(recipesRef, {"name": "mac & cheese"})
  return "recipes";
}

function RecipeEntry(props) {
  const { text, uid } = props.recipe;

  return <p>{text}</p>
}

export default App;
