import React from 'react';
import { Page, Text, Button, Spacer, Loading } from '@geist-ui/core';
import { useAuth } from '../features/auth/useAuth';

const Home: React.FC = () => {
  const { user, isLoading, isAuthorized, authError, signInWithGoogle, signOut } = useAuth();

  // --- Loading state ---
  if (isLoading) {
    return (
      <Page className="home-page">
        <Page.Content>
          <div className="home-hero">
            <Loading>Signing in…</Loading>
          </div>
        </Page.Content>
      </Page>
    );
  }

  // --- Authorized signed-in state ---
  if (isAuthorized && user) {
    return (
      <Page className="home-page">
        <Page.Content>
          <div className="home-hero">
            <img
              src="/app-icons/abgFit-192.png"
              alt="abgFit logo"
              className="home-logo"
            />
            <Spacer h={1} />
            <Text h1 className="home-title">abgFit</Text>
            <Spacer h={0.5} />
            <Text p className="home-welcome">
              Welcome, {user.displayName ?? user.email}
            </Text>
            <Text p className="home-auth-status">
              Authentication is active
            </Text>
            <Spacer h={2} />
            <Button
              type="abort"
              scale={1.1}
              width="100%"
              onClick={signOut}
              placeholder={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            >
              Sign out
            </Button>
          </div>
        </Page.Content>
      </Page>
    );
  }

  // --- Signed-out state (with optional unauthorized or error message) ---
  return (
    <Page className="home-page">
      <Page.Content>
        <div className="home-hero">
          <img
            src="/app-icons/abgFit-192.png"
            alt="abgFit logo"
            className="home-logo"
          />
          <Spacer h={1} />
          <Text h1 className="home-title">
            abgFit
          </Text>
          <Text p className="home-subtitle">
            Your AI-powered fitness companion
          </Text>
          {authError && (
            <>
              <Spacer h={1} />
              <Text p className="home-auth-error">
                {authError}
              </Text>
            </>
          )}
          <Spacer h={2} />
          <Button
            type="success"
            scale={1.2}
            width="100%"
            onClick={signInWithGoogle}
            loading={isLoading}
            disabled={isLoading}
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            Continue with Google
          </Button>
        </div>
      </Page.Content>
    </Page>
  );
};

export default Home;
