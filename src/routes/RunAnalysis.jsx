import React from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import RunAnalysisForm from '../components/eda/RunAnalysisForm.jsx';
import EdaJobStatus from '../components/eda/EdaJobStatus.jsx';
import EdaResult from '../components/eda/EdaResult.jsx';
import EdaJobHistory from '../components/eda/EdaJobHistory.jsx';

const RunAnalysis = () => {
    const navigate = useNavigate();

    return (
        <div className="eda-page">
            <Routes>
                <Route path="/" element={<RunAnalysisForm navigate={navigate} />} />
                <Route path="/history" element={<EdaJobHistory navigate={navigate} />} />
                <Route path="/status/:jobId" element={<EdaJobStatus navigate={navigate} />} />
                <Route path="/result/:jobId" element={<EdaResult navigate={navigate} />} />
            </Routes>
        </div>
    );
};

export default RunAnalysis;

