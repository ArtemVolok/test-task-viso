import React, { useCallback, useEffect, useState } from "react";
import { firestore } from "../../firebase";
import {
  setDoc,
  deleteDoc,
  doc,
  collection,
  getDocs,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  MarkerClustererF,
} from "@react-google-maps/api";

import { MAP_API } from "../../constants";

import "./style.scss";

interface MarkerPosition {
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  next?: string | null;
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

      const timestamp = Date.now().toString();
      const newMarker: MarkerPosition = {
        location: { lat: event.latLng.lat(), lng: event.latLng.lng() },
        timestamp,
      };

      try {
        await setDoc(doc(firestore, "Markers", newMarker.timestamp), newMarker);

        setMarkers((markers) => [...markers, newMarker]);

        if (markers.length > 0) {
          const lastMarker = markers[markers.length - 1];

          await updateDoc(doc(firestore, "Markers", lastMarker.timestamp), {
            next: newMarker.timestamp,
          });
        }
      } catch (e) {
        console.log("Error adding document", e);
      }
    },
    [markers]
  );

  const handleMarkerClick = useCallback(
    async (timestamp: string) => {
      const markerIndex = markers.findIndex(
        (mark) => mark.timestamp === timestamp
      );

      if (markerIndex === -1) return;

      const previousMarker = markers[markerIndex - 1] || null;
      const nextMarker = markers[markerIndex + 1] || null;

      try {
        const docRef = doc(firestore, "Markers", timestamp);
        await deleteDoc(docRef);
        setMarkers((current) =>
          current.filter((mark) => mark.timestamp !== timestamp)
        );

        if (previousMarker) {
          const updatedPreviousMarker = {
            ...previousMarker,
            next: nextMarker ? nextMarker.timestamp : null,
          };

          const previousMarkerRef = doc(
            firestore,
            "Markers",
            previousMarker.timestamp
          );
          await updateDoc(previousMarkerRef, {
            next: updatedPreviousMarker.next,
          });

          setMarkers((current) =>
            current.map((mark) =>
              mark.timestamp === previousMarker.timestamp
                ? updatedPreviousMarker
                : mark
            )
          );
        }
      } catch (e) {
        console.log("Error removing document", e);
      }
    },
    [markers]
  );

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

  const handleMarkerDragEnd = useCallback(
    async (event: google.maps.MapMouseEvent, timestamp: string) => {
      if (!event.latLng) {
        console.log("Marker detail info is not available");
        return;
      }

      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();

      try {
        const docRef = doc(firestore, "Markers", timestamp);
        await updateDoc(docRef, {
          location: { lat: newLat, lng: newLng },
        });

        setMarkers((current) =>
          current.map((mark) =>
            mark.timestamp === timestamp
              ? { ...mark, location: { lat: newLat, lng: newLng } }
              : mark
          )
        );
      } catch (e) {
        console.log("Error updating document", e);
      }
    },
    []
  );

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
                  onClick={() => handleMarkerClick(mark.timestamp)}
                  key={mark.timestamp}
                  draggable
                  clusterer={clusterer}
                  position={mark.location}
                  onDragEnd={(e) => handleMarkerDragEnd(e, mark.timestamp)}
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
