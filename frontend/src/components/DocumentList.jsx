import React, { useEffect, useState } from "react";
import "./DocumentList.css"; // Add your custom CSS file
import { Link } from 'react-router-dom';


export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocuments = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await fetch("http://localhost:8080/api/user/documents", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Unauthorized or failed to fetch");
        }

        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        console.error("Document fetch failed:", err);
        setError("Failed to load documents");
      }
    };

    fetchDocuments();
  }, []);

  return (
    <section id="documents" className="document-section">
      <h2>My Documents</h2>

      {error && <p className="error">{error}</p>}

      <div className="document-grid">
        {documents.length === 0 ? (
          <p>No documents found.</p>
        ) : (
          documents.map((doc) => (
            <Link to={`/document/${doc.id}`} className="document-tile">
              <h3>{doc.title}</h3>
              <p>{new Date(doc.created_at.Time).toLocaleDateString()}</p>
            </Link>
          ))
        )}
      </div>

    </section>
  );
}
