import React from 'react';
import {Route, Routes, useNavigate} from "react-router";
import FileList from "../components/Files/FileList.jsx";
import FileDetails from "../components/Files/FileDetails.jsx";

const Files = () => {
    const navigate = useNavigate();

    return (
        <div className="files-page">
            <Routes>
                <Route path="/" element={<FileList navigate={navigate} />} />
                <Route path="file-detail/:fileName" element={<FileDetails navigate={navigate} />} />
            </Routes>
        </div>
    );
};

export default Files;

