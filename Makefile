deploy_testnet_position_manager:
    npx hardhat compile
    npx hardhat --network posi_testnet deploy --stage test --task 'deploy BTCBUSD position manager'
    npx hardhat --network posi_testnet deploy --stage test --task 'deploy BNBBUSD position manager'
    npx hardhat --network posi_testnet deploy --stage test --task 'deploy ETHBUSD position manager'
    npx hardhat --network posi_testnet deploy --stage test --task 'deploy CAKEBUSD position manager'
    npx hardhat --network posi_testnet deploy --stage test --task 'deploy DOGEBUSD position manager'