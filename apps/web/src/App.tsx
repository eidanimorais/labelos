import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ImportData } from './pages/ImportData';
import { Tracks } from './pages/Tracks';
import { Songs } from './pages/Songs';
import { SongDetails } from './pages/SongDetails';
import { TrackDetails } from './pages/TrackDetails';
import { Territories } from './pages/Territories';
import { SplitBuilder } from './pages/SplitBuilder';
import { InteractiveSplit } from './pages/InteractiveSplit';
import { ArtistProfile } from './pages/ArtistProfile';
import { Reconciliation } from './pages/Reconciliation';
import { RevenueReport } from './pages/RevenueReport';
import Contracts from './pages/Contracts';
import { ContractDetails } from './pages/ContractDetails';
import WorksList from './pages/WorksList';
import { AssetHub } from './pages/AssetHub';
import { Profiles } from './pages/Profiles';
import { StorageMonitor } from './pages/StorageMonitor';
import { BulkManager } from './pages/BulkManager';


import { DataProvider } from './contexts/DataProvider';

function App() {
    return (
        <BrowserRouter>
            <DataProvider>
                <Routes>
                    <Route path="/cadastrar" element={<AssetHub />} />

                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="import" element={<ImportData />} />
                        <Route path="isrc" element={<Tracks />} />
                        <Route path="songs" element={<Songs />} />
                        <Route path="songs/:name" element={<SongDetails />} />
                        <Route path="isrc/:isrc" element={<TrackDetails />} />
                        <Route path="territories" element={<Territories />} />
                        <Route path="splits" element={<SplitBuilder />} />
                        <Route path="splits/:isrc/editor" element={<InteractiveSplit />} />
                        <Route path="conciliacao" element={<Reconciliation />} />
                        <Route path="revenue-report" element={<RevenueReport />} />

                        <Route path="artista/:name" element={<ArtistProfile />} />
                        <Route path="contracts" element={<Contracts />} />
                        <Route path="contracts/:id" element={<ContractDetails />} />
                        <Route path="works" element={<WorksList />} />
                        <Route path="profiles" element={<Profiles />} />
                        <Route path="monitor" element={<StorageMonitor />} />
                        <Route path="bulk" element={<BulkManager />} />

                    </Route>
                </Routes>
            </DataProvider>
        </BrowserRouter>
    );
}

export default App;
