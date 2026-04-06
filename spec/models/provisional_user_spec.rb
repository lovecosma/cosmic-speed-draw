require "rails_helper"

RSpec.describe ProvisionalUser, type: :model do
  it "has many drawings" do
    puser = create(:provisional_user)
    create(:drawing, :provisional, provisional_user: puser)
    expect(puser.drawings.count).to eq(1)
  end

  it "destroys associated drawings on destroy" do
    puser = create(:provisional_user)
    create(:drawing, :provisional, provisional_user: puser)
    expect { puser.destroy! }.to change(Drawing, :count).by(-1)
  end
end
