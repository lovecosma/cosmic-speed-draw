require "rails_helper"

RSpec.describe Drawing, type: :model do
  subject(:drawing) { build(:drawing) }

  describe "associations" do
    it "belongs to a user" do
      expect(drawing.user).to be_a(User)
    end

    it "is invalid without a user" do
      drawing.user = nil
      expect(drawing).not_to be_valid
    end
  end

  describe "validations" do
    it { is_expected.to be_valid }
  end

  describe "canvas_data" do
    it "stores JSON" do
      drawing.canvas_data = { shapes: [ { type: "rect", x: 0, y: 0 } ] }
      drawing.save!
      expect(drawing.reload.canvas_data).to eq({ "shapes" => [ { "type" => "rect", "x" => 0, "y" => 0 } ] })
    end
  end

  describe "scopes and queries" do
    let!(:user) { create(:user) }
    let!(:other_user) { create(:user) }

    it "can be scoped to a user" do
      create_list(:drawing, 2, user: user)
      create(:drawing, user: other_user)

      expect(Drawing.where(user: user).count).to eq(2)
    end
  end
end
