class CreateProvisionalUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :provisional_users do |t|
      t.timestamps
    end
  end
end
