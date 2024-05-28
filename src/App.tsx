import { APIProvider } from "@vis.gl/react-google-maps";
import { MAP_API } from "./constants";
import CustomMap from "./components/map";

const App = () => (
  <>
    <APIProvider apiKey={MAP_API}>
      <CustomMap />
    </APIProvider>
  </>
);

export default App;
