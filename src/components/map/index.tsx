import { Map, Marker, useMarkerRef } from "@vis.gl/react-google-maps";

const CustomMap = () => {
  const [markerRef, marker] = useMarkerRef();
  console.log("marker", marker);

  return (
    <Map
      style={{ width: "800px", height: "800px" }}
      defaultCenter={{ lat: 53.54992, lng: 10.00678 }}
      defaultZoom={12}
      gestureHandling={"greedy"}
      disableDefaultUI={true}
    >
      <Marker ref={markerRef} position={{ lat: 53.54992, lng: 10.00678 }} />
    </Map>
  );
};

export default CustomMap;
