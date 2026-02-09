import React from 'react';
import { Route, Routes, useNavigate } from "react-router";
import AgentList from "../components/agents/AgentList.jsx";
import AgentDetails from "../components/agents/AgentDetails.jsx";
import AgentForm from "../components/agents/AgentForm.jsx";
import SchemaMetadata from "./SchemaMetadata.jsx";
import SemanticMetadata from "./SemanticMetadata.jsx";

const Agents = () => {
    const navigate = useNavigate();

    return (
        <div className="agents-page">
            <Routes>
                <Route path="/" element={<AgentList navigate={navigate} />} />
                <Route path="/create" element={<AgentForm navigate={navigate} mode="create" />} />
                <Route path="/agent-detail/:agentId" element={<AgentDetails navigate={navigate} />} />
                <Route path="/edit/:agentId" element={<AgentForm navigate={navigate} mode="edit" />} />
                <Route path="/schema/*" element={<SchemaMetadata />} />
                <Route path="/semantic/*" element={<SemanticMetadata />} />
            </Routes>
        </div>
    );
};

export default Agents;
