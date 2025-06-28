import React from 'react';
import { Container } from 'react-bootstrap';
import DocumentList from '../components/DocumentList';
import '../styles.css';

export default function Home() {
  return (
    <h1>
      This is the Home Page.
      <DocumentList/>
    </h1>
  );
}




/*

It should display the current users documents, an option 
to create a document, and an option to share a document.

It should also allow the user to click on a document and 
that will navigate them to the document editor

*/