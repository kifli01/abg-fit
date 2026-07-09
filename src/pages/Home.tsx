import React from 'react';
import { Page, Text, Button, Spacer, Loading } from '@geist-ui/core';
import { useAuth } from '../features/auth/useAuth';

/**
 * Home is the signed-out landing / login screen.
 * Authenticated routing is handled in App.tsx — this page
 * is only shown to users who are not signed in.
 */
const Home: React.FC = () => {
  const { isLoading, authError, signInWithGoogle } = useAuth();

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
