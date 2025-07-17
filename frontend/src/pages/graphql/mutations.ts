import { gql } from '@apollo/client'

export const LOGIN_USER = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
      }
    }
  }
`

export const REGISTER_USER = gql`
  mutation Register($input: UserInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`

export const UPLOAD_HOLDINGS = gql`
  mutation UploadHoldings($file: Upload!) {
    uploadHoldings(file: $file) {
      success
    }
  }
`
