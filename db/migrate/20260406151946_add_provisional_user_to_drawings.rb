class AddProvisionalUserToDrawings < ActiveRecord::Migration[8.0]
  def up
    add_reference :drawings, :provisional_user, foreign_key: true, null: true

    # user_id is currently NOT NULL — relax it so drawings can belong to a provisional_user
    change_column_null :drawings, :user_id, true

    # Remove the existing no-action FK and replace with cascade so deleting a
    # User also destroys their drawings (enforced at the DB level as a safety net;
    # the model also sets dependent: :destroy).
    remove_foreign_key :drawings, :users
    add_foreign_key :drawings, :users, on_delete: :cascade

    # Exactly one of user_id / provisional_user_id must be set.
    execute <<~SQL
      ALTER TABLE drawings
        ADD CONSTRAINT drawing_has_one_owner CHECK (
          (user_id IS NOT NULL AND provisional_user_id IS NULL) OR
          (user_id IS NULL     AND provisional_user_id IS NOT NULL)
        )
    SQL
  end

  def down
    execute "ALTER TABLE drawings DROP CONSTRAINT drawing_has_one_owner"
    remove_foreign_key :drawings, :users
    add_foreign_key :drawings, :users
    change_column_null :drawings, :user_id, false
    remove_reference :drawings, :provisional_user, foreign_key: true
  end
end
