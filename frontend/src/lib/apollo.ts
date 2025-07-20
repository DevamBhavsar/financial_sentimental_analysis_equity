import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { AuthManager } from "./auth";

// Create upload link
const uploadLink = createUploadLink({
  uri: "http://localhost:8000/graphql",
  headers: {
    "apollo-require-preflight": "true",
  },
});

// Enhanced auth link with token validation
const authLink = setContext((_, { headers }) => {
  const token = AuthManager.getToken();
  
  // Check if token is valid before using it
  if (token && !AuthManager.isTokenExpired(token)) {
    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    };
  }
  
  // If token is expired or doesn't exist, don't send authorization header
  return {
    headers: {
      ...headers,
    },
  };
});

// Enhanced error link with auth handling
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
            locations
          )}, Path: ${path}`
        );
        
        // Handle authentication errors
        if (message.includes('Authentication required') || 
            message.includes('Unauthorized') ||
            message.includes('Invalid token')) {
          console.log('Authentication error detected, logging out...');
          AuthManager.logout();
        }
      });
    }

    if (networkError) {
      console.error(`[Network error]:`, networkError);

      // Handle 401 Unauthorized errors
      if ("statusCode" in networkError && networkError.statusCode === 401) {
        console.log('Unauthorized access, logging out...');
        AuthManager.logout();
      }

      // Log additional details for debugging
      if ("statusCode" in networkError) {
        console.error(`Status: ${networkError.statusCode}`);
      }

      if ("result" in networkError) {
        console.error("Result:", networkError.result);
      }

      if ("response" in networkError) {
        console.error("Response:", networkError.response);
      }
    }
  }
);

export const client = new ApolloClient({
  link: from([errorLink, authLink, uploadLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});
