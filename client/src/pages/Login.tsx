import { SignIn } from "@clerk/react";

const LoginPage = () => (
  <div className="flex items-center justify-center min-h-[calc(100-64px)] py-12">
    {/* path tells Clerk where it lives, routing="path" enables URL sync */}
    <SignIn path="/login" routing="path" signUpUrl="/signup" />
  </div>
);
export default LoginPage;