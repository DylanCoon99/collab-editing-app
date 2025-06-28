import React, { useEffect, useState } from "react";

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
    <section id="documents" style={{ padding: "4rem" }}>
      <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>My Documents</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {documents.length === 0 ? (
        <p>No documents found.</p>
      ) : (
        <ul className="document-list" style={{ listStyle: "none", padding: 0 }}>
          {documents.map((document) => (
            <li key={document.id} className="document-item" style={{ marginBottom: "1.5rem" }}>
              <h3>{document.title}</h3>
              <p>Created at: {new Date(document.created_at.Time).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}

    </section>
  );
}
