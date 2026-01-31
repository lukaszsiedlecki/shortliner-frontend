import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
    const [url, setUrl] = useState('');
    const [shortUrl, setShortUrl] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setShortUrl('');

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/shorten`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (response.ok) {
                setShortUrl(`${process.env.REACT_APP_BACKEND_URL}/shorten/${data.shortCode}`); // Teraz link prowadzi do backendu
            } else {
                setError(data.error || 'Błąd przy skracaniu URL.');
            }
        } catch (error) {
            setError('Wystąpił problem z połączeniem z backendem.');
        }
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center">Skracacz URL</h1>
            <div className="mt-4">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label" htmlFor="urlInput">Długi URL</label>
                        <input
                            className="form-control"
                            id="urlInput"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Wpisz URL"
                            type="text"
                        />
                    </div>
                    <button className="btn btn-primary" type="submit">Generuj</button>
                </form>

                {shortUrl && (
                    <div className="mt-3">
                        <div className="alert alert-success">
                            Skrócony URL:
                            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="btn btn-link">
                                {shortUrl}
                            </a>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-3">
                        <div className="alert alert-danger">{error}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
