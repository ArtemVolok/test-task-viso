import React, { useCallback, useEffect, useState } from "react";
import { firestore } from "../../firebase";
import {
  setDoc,
  deleteDoc,
  doc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  MarkerClustererF,
} from "@react-google-maps/api";
import { v4 as uuidv4 } from "uuid";

import { MAP_API } from "../../constants";

import "./style.scss";

interface MarkerPosition {
  position: {
    lat: number;
    lng: number;
  };
  id: string;
}

const containerStyle = {
  minWidth: "200px",
  minHeight: "600px",
};

const center = {
  lat: 49.8397,
  lng: 24.0297,
};

const MyMapComponent: React.FC = () => {
  const [markers, setMarkers] = useState<MarkerPosition[]>([]);

  const markersRef = collection(firestore, "markers");
  console.log("markersRef", markersRef);

  console.log("markers", markers);

  const { isLoaded } = useJsApiLoader({
    id: "google-map",
    googleMapsApiKey: MAP_API,
  });

  useEffect(() => {
    const fetchMarkers = async () => {
      const querySnapshot = await getDocs(collection(firestore, "Markers"));
      const markersData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as MarkerPosition)
      );
      setMarkers(markersData);
    };

    fetchMarkers();
  }, []);

  const handleMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) {
        console.log("Marker detail info is not available");
        return;
      }

      const newMarker: MarkerPosition = {
        position: { lat: event.latLng.lat(), lng: event.latLng.lng() },
        id: uuidv4(),
      };

      console.log("newMarker", newMarker);

      try {
        await setDoc(doc(firestore, "Markers", newMarker.id), newMarker);
        setMarkers((markers) => [...markers, newMarker]);
      } catch (e) {
        console.log("Error adding document", e);
      }
    },
    []
  );

  const handleMarkerClick = useCallback(async (id: string) => {
    try {
      const docRef = doc(firestore, "Markers", id);
      await deleteDoc(docRef);
      setMarkers((current) => current.filter((mark) => mark.id !== id));
    } catch (e) {
      console.log("Error removing document", e);
    }
  }, []);

  const handleRemoveAllMarkers = async () => {
    const markerDocs = await getDocs(collection(firestore, "Markers"));
    const batch = writeBatch(firestore);

    markerDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    try {
      await batch.commit();
      setMarkers([]);
    } catch (e) {
      console.error("Error removing all markers", e);
    }
  };

  if (!isLoaded) {
    return <p>Loading...</p>;
  }

  return (
    <div className="wrapper">
      <div className="infoBlock">
        <h1 className="infoBlock__title">Welcome!</h1>

        <h3>To set a marker, click on the map.</h3>
        <h3>To remove a marker, click the marker again.</h3>
      </div>
      <GoogleMap
        zoom={12}
        center={center}
        mapContainerStyle={containerStyle}
        onClick={handleMapClick}
      >
        <MarkerClustererF>
          {(clusterer) => (
            <>
              {markers.map((mark, index) => (
                <Marker
                  onClick={() => handleMarkerClick(mark.id)}
                  key={mark.id}
                  draggable
                  clusterer={clusterer}
                  position={mark.position}
                  label={{
                    text: (index + 1).toString(),
                    color: "white",
                  }}
                />
              ))}
            </>
          )}
        </MarkerClustererF>
      </GoogleMap>

      <button className="removeAllButton" onClick={handleRemoveAllMarkers}>
        Remove all markers
      </button>
    </div>
  );
};

export default MyMapComponent;
