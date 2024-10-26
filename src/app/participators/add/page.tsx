// app/add/page.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Participator {
  id: string;
  name: string;
  relation: string;
}

const AddParticipator = () => {
  const [participators, setParticipators] = useState<Participator[]>([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [editingParticipator, setEditingParticipator] = useState<Participator | null>(null);
  const router = useRouter();

  const fetchParticipators = async () => {
    try {
      const token = localStorage.getItem('token'); // Retrieve your token from storage
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

    const token = localStorage.getItem('token'); // Retrieve your token from storage

    try {
      if (editingParticipator) {
        // Update existing participator
        await axios.put('/api/participator', {
          id: editingParticipator.id,
          name,
          relation,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Create new participator
        await axios.post('/api/participator', {
          name,
          relation,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setName('');
      setRelation('');
      setEditingParticipator(null);
      fetchParticipators(); // Refresh the list
    } catch (error) {
      console.error('Error submitting participator:', error);
    }
  };

  const handleEdit = (participator: Participator) => {
    setName(participator.name);
    setRelation(participator.relation);
    setEditingParticipator(participator);
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token'); // Retrieve your token from storage

    try {
      await axios.delete('/api/participator', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { id },
      });
      fetchParticipators(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting participator:', error);
    }
  };

  useEffect(() => {
    fetchParticipators();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Add Participator</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="border border-gray-300 p-2 mr-2"
          required
        />
        <input
          type="text"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          placeholder="Relation"
          className="border border-gray-300 p-2 mr-2"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          {editingParticipator ? 'Update' : 'Add'}
        </button>
      </form>

      <h2 className="text-xl font-bold mb-2">Participators List</h2>
      <ul className="list-disc pl-5">
        {participators.map((participator) => (
          <li key={participator.id} className="flex justify-between items-center mb-2">
            <span>
              {participator.name} - {participator.relation}
            </span>
            <div>
              <button
                onClick={() => handleEdit(participator)}
                className="bg-yellow-500 text-white p-1 mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(participator.id)}
                className="bg-red-500 text-white p-1"
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

export default AddParticipator;
