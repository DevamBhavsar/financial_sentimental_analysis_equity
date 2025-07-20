import { gql } from "@apollo/client";

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    dashboard {
      totalMarketValue
      overallSentiment
      topPerformingAsset
      worstPerformingAsset
      holdings {
        id
        company_name
        isin
        total_quantity
        avg_trading_price
        ltp
        market_value
        overall_gain_loss
      }
    }
  }
`;
