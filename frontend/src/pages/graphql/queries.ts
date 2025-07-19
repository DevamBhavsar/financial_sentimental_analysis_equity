import { gql } from '@apollo/client'

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    dashboard {
      totalHoldings
      overallSentiment
      topPerformingAsset
      worstPerformingAsset
      holdings {
        id
        ticker
        name
        quantity
        avgPrice
        sector
      }
    }
  }
`