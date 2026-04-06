class RemoveProvisionalFromUsers < ActiveRecord::Migration[8.0]
  def up
    remove_column :users, :provisional, :boolean if column_exists?(:users, :provisional)
  end

  def down
    add_column :users, :provisional, :boolean, null: false, default: false unless column_exists?(:users, :provisional)
  end
end
