import { gql } from "@apollo/client";

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    dashboard {
      portfolio {
        totalMarketValue
        totalInvestedValue
        totalGainLoss
        totalGainLossPercent
        todaysGainLoss
        todaysGainLossPercent
        totalDividends
        avgGainLossPercent
      }
      overallSentiment
      topPerformingAsset
      worstPerformingAsset
      totalStocks
      sectorsCount
      holdings {
        id
        company_name
        isin
        sector
        total_quantity
        avg_trading_price
        ltp
        invested_value
        market_value
        overall_gain_loss
        client_id
        market_cap
        stcg_quantity
        stcg_value
        open
        high
        low
        close
        trade_volume
        year_high
        year_low
        total_buy_quantity
        total_sell_quantity
      }
    }
  }
`;

export const ADD_HOLDING = gql`
  mutation AddHolding($input: HoldingInput!) {
    add_holding(input: $input) {
      id
      company_name
      isin
      sector
      total_quantity
      avg_trading_price
      ltp
      invested_value
      market_value
      overall_gain_loss
    }
  }
`;

export const REMOVE_HOLDING = gql`
  mutation RemoveHolding($id: Int!) {
    remove_holding(id: $id)
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    update_profile(input: $input) {
      id
      email
      first_name
      last_name
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    change_password(input: $input)
  }
`;

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      email
      first_name
      last_name
      is_active
      created_at
    }
  }
`;
