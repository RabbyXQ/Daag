'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // Updated import for Next.js 14
import axios from 'axios';
import Land from '../Components/Land';
import Map from '../Components/Map';

interface LandData {
  id: number;
  name: string;
  location: string;
  size: string;
  owner: string;
  landType: string;
  marketValue: string;
  notes: string;
  polygons: Array<Array<{ lat: number; lng: number }>>; // Polygons as a JSON array
}

const ViewLand: React.FC = () => {
  const { id } = useParams(); // Use useParams from next/navigation
  const [landData, setLandData] = useState<LandData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [polygons, setPolygons] = useState<google.maps.LatLngLiteral[][]>([]); // Ensure polygons is initialized as an empty array

  // Retrieve the token from local storage
  const token = localStorage.getItem('token');

  const handlePolygonsChange = (updatedPolygons: google.maps.LatLngLiteral[][]) => {
    setPolygons(updatedPolygons);
  };

  useEffect(() => {
    const fetchLandData = async () => {
      if (id) {
        const numericId = Number(id);
        console.log("Fetching data for ID:", numericId); // Debugging line

        if (!isNaN(numericId)) {
          try {
            console.log("Attempting to fetch data..."); // Debugging line
            const response = await axios.get(`http://localhost:3000/api/land/${numericId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Fetched land data:", response.data); // Debugging line
            setLandData(response.data);
            // Set polygons from the fetched data if it exists
            if (response.data.polygons) {
              setPolygons(response.data.polygons);
            }
          } catch (err) {
            console.error("Error fetching land data:", err);
            setError("Error fetching land data. Please check console for details.");
          } finally {
            setLoading(false);
          }
        } else {
          console.error("Invalid ID format");
          setError("Invalid ID format.");
          setLoading(false);
        }
      } else {
        console.error("ID is not defined");
        setLoading(false);
      }
    };

    fetchLandData();
  }, [id, token]);

  // Debug: Log polygons and display them on the page
  useEffect(() => {
    console.log("Polygons from map:", polygons);
  }, [polygons]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2">
          {landData && (
            <>
              <Map id={Number(id)}/>
              <Land
                id={Number(id)}
                title="Land Details"
                name={landData.name}
                location={landData.location}
                size={landData.size}
                owner={landData.owner}
                land_type={landData.landType}
                market_value={landData.marketValue}
                notes={landData.notes}
                view={true}
              />
              {/* Display polygons on the page */}
              <div className="mt-4">
                <h3 className="font-bold">Polygons Data:</h3>
                <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(polygons, null, 2)}</pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewLand;
