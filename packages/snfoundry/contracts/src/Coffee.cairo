#[starknet::interface]
trait ICoffee<TContractState> {
    fn buy_coffee(ref self: TContractState, message: felt252);
    fn withdraw(ref self: TContractState);
    fn get_total_coffees(self: @TContractState) -> u256;
    fn get_creator(self: @TContractState) -> starknet::ContractAddress;
    fn get_coffee_price(self: @TContractState) -> u256;
    fn get_contract_balance(self: @TContractState) -> u256;
    fn get_recent_coffees(self: @TContractState, count: u64) -> Array<CoffeePurchase>;
    fn set_coffee_price(ref self: TContractState, new_price: u256);
}

#[derive(Drop, Serde, starknet::Store)]
struct CoffeePurchase {
    buyer: starknet::ContractAddress,
    message: felt252,
    amount: u256,
    timestamp: u64,
}

#[starknet::contract]
mod Coffee {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, Vec, VecTrait, MutableVecTrait};
    use super::CoffeePurchase;

    #[storage]
    struct Storage {
        creator: ContractAddress,
        total_coffees: u256,
        coffee_price: u256,
        total_withdrawn: u256,
        coffee_purchases: Vec<CoffeePurchase>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CoffeeBought: CoffeeBought,
        FundsWithdrawn: FundsWithdrawn,
        PriceUpdated: PriceUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct CoffeeBought {
        buyer: ContractAddress,
        message: felt252,
        amount: u256,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct FundsWithdrawn {
        creator: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct PriceUpdated {
        old_price: u256,
        new_price: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, creator: ContractAddress) {
        self.creator.write(creator);
        self.coffee_price.write(1000000000000000); // 0.001 ETH in wei
        self.total_coffees.write(0);
        self.total_withdrawn.write(0);
    }

    #[abi(embed_v0)]
    impl CoffeeImpl of super::ICoffee<ContractState> {
        fn buy_coffee(ref self: ContractState, message: felt252) {
            let caller = get_caller_address();
            let coffee_price = self.coffee_price.read();
            let timestamp = get_block_timestamp();
            
            // Validate message is not empty (felt252 0 is empty)
            assert(message != 0, 'Message cannot be empty');
            
            // For demo purposes, we'll just increment the counter
            // In a real implementation, you'd handle ETH transfer here
            
            let current_coffees = self.total_coffees.read();
            self.total_coffees.write(current_coffees + 1);

            // Store the coffee purchase
            let purchase = CoffeePurchase {
                buyer: caller,
                message: message,
                amount: coffee_price,
                timestamp: timestamp,
            };
            self.coffee_purchases.push(purchase);

            self.emit(CoffeeBought {
                buyer: caller,
                message: message,
                amount: coffee_price,
                timestamp: timestamp,
            });
        }

        fn withdraw(ref self: ContractState) {
            let caller = get_caller_address();
            let creator = self.creator.read();
            
            assert(caller == creator, 'Only creator can withdraw');
            
            // For demo purposes, this just tracks withdrawal amount
            // In real implementation, transfer contract balance to creator
            let total_coffees = self.total_coffees.read();
            let coffee_price = self.coffee_price.read();
            let total_earned = total_coffees * coffee_price;
            let already_withdrawn = self.total_withdrawn.read();
            let available_to_withdraw = total_earned - already_withdrawn;
            
            assert(available_to_withdraw > 0, 'No funds to withdraw');
            
            self.total_withdrawn.write(total_earned);
            
            self.emit(FundsWithdrawn {
                creator: creator,
                amount: available_to_withdraw,
            });
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

        fn get_contract_balance(self: @ContractState) -> u256 {
            // For demo purposes, this calculates theoretical balance
            let total_coffees = self.total_coffees.read();
            let coffee_price = self.coffee_price.read();
            let total_earned = total_coffees * coffee_price;
            let withdrawn = self.total_withdrawn.read();
            total_earned - withdrawn
        }

        fn get_recent_coffees(self: @ContractState, count: u64) -> Array<CoffeePurchase> {
            let mut result = ArrayTrait::new();
            let total_purchases = self.coffee_purchases.len();
            
            if total_purchases == 0 {
                return result;
            }
            
            let start_index = if total_purchases > count {
                total_purchases - count
            } else {
                0
            };
            
            let mut i = start_index;
            loop {
                if i >= total_purchases {
                    break;
                }
                result.append(self.coffee_purchases[i].read());
                i += 1;
            };
            
            result
        }

        fn set_coffee_price(ref self: ContractState, new_price: u256) {
            let caller = get_caller_address();
            let creator = self.creator.read();
            
            assert(caller == creator, 'Only creator can set price');
            assert(new_price > 0, 'Price must be greater than 0');
            
            let old_price = self.coffee_price.read();
            self.coffee_price.write(new_price);
            
            self.emit(PriceUpdated {
                old_price: old_price,
                new_price: new_price,
            });
        }
    }
}