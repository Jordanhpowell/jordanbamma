import AnalyzerDashboard from './analyzer-dashboard';

type DashboardProps = {
    handleTabChange: (active_number: number) => void;
};

const Dashboard = ({ handleTabChange }: DashboardProps) => (
    <AnalyzerDashboard handleTabChange={handleTabChange} />
);

export default Dashboard;
