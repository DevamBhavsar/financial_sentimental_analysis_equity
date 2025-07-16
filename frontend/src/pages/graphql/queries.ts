import { gql } from '@apollo/client'

export const GET_ME = gql`
  query Me {
    me {
      id
      email
      first_name
      last_name
    }
  }
`

export const GET_HOLDINGS = gql`
  query Holdings {
    holdings {
      id
      ticker
      name
      quantity
      avg_price
      current_price
      sector
      holding_type
    }
  }
`

export const GET_WATCHLIST = gql`
  query Watchlist {
    watchlist {
      id
      ticker
      name
      sector
    }
  }
`
