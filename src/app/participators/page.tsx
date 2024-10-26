"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Participator {
  id: string;
  name: string;
  relation: string;
  portion: number; // Add portion field to the interface
}

const ParticipatorsPage = () => {
  const [participators, setParticipators] = useState<Participator[]>([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [portion, setPortion] = useState<number | ''>(''); // Add state for portion
  const [editingParticipator, setEditingParticipator] = useState<Participator | null>(null);
  const router = useRouter();

  const fetchParticipators = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/participator', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setParticipators(response.data);
    } catch (error) {
      console.error('Error fetching participators:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingParticipator) {
        await axios.put('/api/participator', {
          id: editingParticipator.id,
          name,
          relation,
          portion, // Send portion value on update
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.post('/api/participator', {
          name,
          relation,
          portion, // Send portion value on creation
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setName('');
      setRelation('');
      setPortion(''); // Reset portion field
      setEditingParticipator(null);
      fetchParticipators();
    } catch (error) {
      console.error('Error submitting participator:', error);
    }
  };

  const handleEdit = (participator: Participator) => {
    setName(participator.name);
    setRelation(participator.relation);
    setPortion(participator.portion); // Set portion when editing
    setEditingParticipator(participator);
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');

    try {
      await axios.delete('/api/participator', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { id },
      });
      fetchParticipators();
    } catch (error) {
      console.error('Error deleting participator:', error);
    }
  };

  useEffect(() => {
    fetchParticipators();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-700 mb-6">Participators</h1>

      <form onSubmit={handleSubmit} className="flex items-center mb-6 space-x-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="border border-gray-300 rounded-md p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="text"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          placeholder="Relation"
          className="border border-gray-300 rounded-md p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="number" // Use number input for portion
          value={portion}
          onChange={(e) => setPortion(Number(e.target.value) || '')} // Convert to number
          placeholder="Portion"
          className="border border-gray-300 rounded-md p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md transition-all"
        >
          {editingParticipator ? 'Update' : 'Add'}
        </button>
      </form>

      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Participators List</h2>
      <ul className="space-y-3">
        {participators.map((participator) => (
          <li
            key={participator.id}
            className="flex justify-between items-center bg-white p-4 rounded-md shadow-sm hover:shadow-md transition-all"
          >
            <span className="text-gray-700 font-medium">
              {participator.name} - {participator.relation} - Portion: {participator.portion} // Display portion
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(participator)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(participator.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-all"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipatorsPage;
