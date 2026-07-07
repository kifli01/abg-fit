import React from 'react';
import { Page, Text, Button, Spacer } from '@geist-ui/core';

const Home: React.FC = () => {
  return (
    <Page className="home-page">
      <Page.Content>
        <div className="home-hero">
          <img
            src="/assets/app-icons/abgFit-192.png"
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
          <Spacer h={2} />
          <Button
            type="success"
            scale={1.2}
            width="100%"
            onClick={() => {
              // Google Sign-In — to be wired in a future iteration
            }}
          >
            Continue with Google
          </Button>
        </div>
      </Page.Content>
    </Page>
  );
};

export default Home;
