import React from 'react';
import { Route, Routes, useNavigate } from "react-router";
import SemanticDetail from "../components/agents/SemanticDetail.jsx";
import SemanticEditor from "../components/agents/SemanticEditor.jsx";

const SemanticMetadata = () => {
    const navigate = useNavigate();

    return (
        <div className="schema-metadata-page">
            <Routes>
                <Route path="/:agentId" element={<SemanticDetail navigate={navigate} />} />
                <Route path="/:agentId/edit" element={<SemanticEditor navigate={navigate} />} />
            </Routes>
        </div>
    );
};

export default SemanticMetadata;
