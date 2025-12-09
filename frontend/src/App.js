import "./styles/main.css";
import SearchBox from "./components/SearchBox";

export default function App() {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>AI Ingredient Finder</h1>
      <SearchBox />
    </div>
  );
}
