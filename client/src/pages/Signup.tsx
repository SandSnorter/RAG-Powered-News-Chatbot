import { SignUp } from "@clerk/react";

const SignUpPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-neutral-900 px-4">
      <SignUp 
        path="/signup" 
        routing="path" 
        signInUrl="/login"
        // This ensures after signing up, they go to the home page
        forceRedirectUrl="/" 
        appearance={{
          variables: {
            colorPrimary: "#a855f7", 
            colorBackground: "#171717",
            colorText: "white",
          }
        }}
      />
    </div>
  );
};

export default SignUpPage;