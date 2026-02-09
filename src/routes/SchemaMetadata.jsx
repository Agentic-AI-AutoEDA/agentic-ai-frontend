import React from 'react';
import { Route, Routes, useNavigate } from "react-router";
import SchemaDetail from "../components/agents/SchemaDetail.jsx";
import SchemaEditor from "../components/agents/SchemaEditor.jsx";

const SchemaMetadata = () => {
    const navigate = useNavigate();

    return (
        <div className="schema-metadata-page">
            <Routes>
                <Route path="/:agentId" element={<SchemaDetail navigate={navigate} />} />
                <Route path="/:agentId/edit" element={<SchemaEditor navigate={navigate} />} />
            </Routes>
        </div>
    );
};

export default SchemaMetadata;
