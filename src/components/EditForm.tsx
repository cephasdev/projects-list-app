import { useState, useEffect, useContext, ChangeEvent } from 'react';
import { useHistory } from 'react-router-dom';
import DispatchContext from '../DispatchContext';
import StateContext from '../StateContext';
import { predefinedUsers } from './PredefinedUsers';
import Literature from './Literature';

function EditForm() {
    const history = useHistory();

    const [title, setTitle] = useState('');
    const [program, setProgram] = useState('');
    const [researchArea, setResearchArea] = useState('');
    // const [literature, setLiterature] = useState('');
    const [literature, setLiterature] = useState<string[]>([]);
    const [isGroupProject, setIsGroupProject] = useState(false);
    const [users, setUsers] = useState<string[]>([]);

    const appState = useContext(StateContext);
    const appDispatch = useContext(DispatchContext);

    useEffect(() => {
        setTitle('');
        setProgram('');
        setResearchArea('');
        setLiterature([]);
        setIsGroupProject(false);
        setUsers([]);
    }, []);

    useEffect(() => {
        if (!appState.savingNewProjectIsExecuting) {
            return;
        }
        const projectData = {
            title,
            program,
            researchArea,
            literature,
            isGroupProject,
            users
        };

        try {
            // save values from the edit form

            const port = process.env.APIPORT || 3001;
            fetch(`http://localhost:${port}/api/project/new`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            })
                .then((data) => {
                    console.log(
                        '/api/program/new',
                        'New project was successfully saved.'
                    );
                })
                .catch((err) => {
                    console.log(
                        'There was an error calling the /api/program/new endpoint.'
                    );
                    console.log(err);
                });
            appDispatch({ type: 'savingNewProjectEnded' });
        } catch (err) {
            console.log('Error on save.', err);
        }
    }, [appState.savingNewProjectIsExecuting]);

    useEffect(() => {
        if (!appState.isEditMode) {
            history.push('/');
        }
    }, [appState.isEditMode]);

    function onUsersChange(ev: ChangeEvent<HTMLSelectElement>) {
        // https://stackoverflow.com/a/49684109
        let values = Array.from(
            ev.target.selectedOptions,
            (option) => option.value
        );
        setUsers(values);
    }

    return (
        <div className="edit-form container p-3">
            <h2>Edit Form</h2>
            <div>
                <div className="mb-3">
                    <label htmlFor="program" className="form-label">
                        Program
                    </label>
                    <select
                        onChange={(ev) => setProgram(ev.target.value)}
                        className="form-select"
                        name="program"
                        id="program"
                    >
                        <option value="">Choose Program</option>
                        {appState.programs.map((prog, idx) => {
                            return (
                                <option key={idx} value={prog._id}>
                                    {prog.title}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                        Project Title
                    </label>
                    <input
                        type="text"
                        onChange={(ev) => setTitle(ev.target.value)}
                        className="form-control"
                        name="title"
                        id="title"
                        autoComplete="off"
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="researchArea" className="form-label">
                        Research Area
                    </label>
                    <select
                        onChange={(ev) => setResearchArea(ev.target.value)}
                        className="form-select"
                        name="researchArea"
                        id="researchArea"
                    >
                        <option value="">Choose Research Area</option>
                        {appState.researchAreas.map((area, idx) => {
                            return (
                                <option key={idx} value={area._id}>
                                    {area.title}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="mb-3">
                    <Literature
                        literatureItems={literature}
                        setLiteratureItems={setLiterature}
                    />
                </div>
                <div className="mb-3 form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="isGroupProject"
                        checked={isGroupProject}
                        onChange={(ev) => setIsGroupProject(!isGroupProject)}
                    />
                    <label
                        className="form-check-label"
                        htmlFor="isGroupProject"
                    >
                        Group Project?
                    </label>
                </div>
                {isGroupProject && (
                    <div className="mb-3">
                        <label htmlFor="users" className="form-label">
                            Users
                        </label>
                        <select
                            onChange={onUsersChange}
                            className="form-select"
                            name="users"
                            id="users"
                            multiple
                        >
                            {predefinedUsers.map((user, idx) => {
                                return (
                                    <option key={idx} value={idx}>
                                        {user}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}
                <div className="mb-3">
                    <label htmlFor="projectFiles" className="form-label">
                        Project Files
                    </label>
                    <input
                        type="file"
                        multiple
                        className="form-control"
                        id="projectFiles"
                        aria-describedby="emailHelp"
                    />
                </div>
            </div>
        </div>
    );
}

export default EditForm;
