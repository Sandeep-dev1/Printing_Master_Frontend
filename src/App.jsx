import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./component/Login"
import Home from "./component/Home"
import Pcs from "./component/Pcs";
import Novex from "./component/Novex";



// styles
import "./Styles/Utils.css"
import "./Styles/Home.css"
import "./Styles/Pcs.css"
import "./Styles/App.css"


function App() {
  return (
  <Router>
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/Home" element={<Home/>}/>
      <Route path="/Pcs" element={<Pcs/>}/>
      <Route path="/Novex" element={<Novex/>}/>
    </Routes>
  </Router>
  )
}

export default App
 
 export const Server='http://192.168.1.100:5009'; 
 export const FileGeneration='http://192.168.1.100:5018'; 
 export const OrderServer='http://192.168.1.100:5004';
 export const ZipServer='http://192.168.1.100:5012';
 export const LogInsert='http://192.168.1.100:5003';  

// export const Server='http://localhost:5009'; 
// export const FileGeneration='http://localhost:5018'; 
// export const OrderServer='http://localhost:5004';
// export const ZipServer='http://localhost:5012';
// export const LogInsert='http://localhost:5003';  

 