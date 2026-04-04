class CreateDrawings < ActiveRecord::Migration[8.0]
  def change
    create_table :drawings do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.json :canvas_data
      t.string :image_url
      t.datetime :last_autosaved_at

      t.timestamps
    end
  end
end
