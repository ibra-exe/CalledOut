import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyApSUlvK3IFcyZ06WFucPXIxmoYBUD_yM4",
  authDomain: "called-out-game.firebaseapp.com",
  databaseURL: "https://called-out-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "called-out-game",
  storageBucket: "called-out-game.appspot.com",
  messagingSenderId: "986223458646",
  appId: "1:986223458646:web:9937ded2c9eebda4eafef7"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
