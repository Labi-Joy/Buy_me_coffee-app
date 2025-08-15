#[starknet::interface]
trait ICoffee<TContractState> {
    fn buy_coffee(ref self: TContractState, message: felt252);
    fn withdraw(ref self: TContractState);
    fn get_total_coffees(self: @TContractState) -> u256;
    fn get_creator(self: @TContractState) -> starknet::ContractAddress;
    fn get_coffee_price(self: @TContractState) -> u256;
}

#[starknet::contract]
mod Coffee {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        creator: ContractAddress,
        total_coffees: u256,
        coffee_price: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CoffeeBought: CoffeeBought,
    }

    #[derive(Drop, starknet::Event)]
    struct CoffeeBought {
        buyer: ContractAddress,
        message: felt252,
        amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, creator: ContractAddress) {
        self.creator.write(creator);
        self.coffee_price.write(1000000000000000); // 0.001 ETH in wei
        self.total_coffees.write(0);
    }

    #[abi(embed_v0)]
    impl CoffeeImpl of super::ICoffee<ContractState> {
        fn buy_coffee(ref self: ContractState, message: felt252) {
            let caller = get_caller_address();
            let coffee_price = self.coffee_price.read();
            
            // In a real implementation, you'd handle ETH transfer here
            // For demo purposes, we'll just increment the counter
            
            let current_coffees = self.total_coffees.read();
            self.total_coffees.write(current_coffees + 1);

            self.emit(CoffeeBought {
                buyer: caller,
                message: message,
                amount: coffee_price,
            });
        }

        fn withdraw(ref self: ContractState) {
            let caller = get_caller_address();
            let creator = self.creator.read();
            
            assert(caller == creator, 'Only creator can withdraw');
            
            // In real implementation, transfer contract balance to creator
            // For demo purposes, this is just a placeholder
        }

        fn get_total_coffees(self: @ContractState) -> u256 {
            self.total_coffees.read()
        }

        fn get_creator(self: @ContractState) -> ContractAddress {
            self.creator.read()
        }

        fn get_coffee_price(self: @ContractState) -> u256 {
            self.coffee_price.read()
        }
    }
}