
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Simply render children without any authentication check
  return <>{children}</>;
};

export default ProtectedRoute;
