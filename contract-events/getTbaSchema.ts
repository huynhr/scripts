import { gql } from "graphql-request";

const getTbaSchema = gql`
  query GetTokenboundAccount($tokenAddress: Address!, $tokenId: String!) {
    Accounts(
      input: {
        filter: {
          tokenAddress: { _eq: $tokenAddress }
          tokenId: { _eq: $tokenId }
        }
        blockchain: ethereum
        limit: 200
      }
    ) {
      Account {
        address {
          addresses
          domains {
            name
            isPrimary
          }
          socials {
            dappName
            profileName
          }
        }
      }
    }
  }
`;

export default getTbaSchema;
