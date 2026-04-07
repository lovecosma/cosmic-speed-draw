class AddLastSeenAtToProvisionalUsers < ActiveRecord::Migration[8.0]
  def up
    add_column :provisional_users, :last_seen_at, :datetime

    execute <<~SQL
      UPDATE provisional_users
      SET last_seen_at = created_at
      WHERE last_seen_at IS NULL
    SQL

    change_column_null :provisional_users, :last_seen_at, false
  end

  def down
    remove_column :provisional_users, :last_seen_at
  end
end
