require "rails_helper"

RSpec.describe ProvisionalMigrator do
  let(:provisional_user) { create(:provisional_user) }
  let(:real_user) { create(:user) }

  subject(:migrator) { described_class.new(provisional_user, real_user) }

  describe "#migrate!" do
    context "with a provisional user and drawings" do
      let!(:drawing) { create(:drawing, :provisional, provisional_user: provisional_user) }

      it "reassigns drawings to the real user" do
        migrator.migrate!
        expect(drawing.reload.user_id).to eq(real_user.id)
      end

      it "clears provisional_user_id on reassigned drawings" do
        migrator.migrate!
        expect(drawing.reload.provisional_user_id).to be_nil
      end

      it "destroys the provisional user" do
        migrator.migrate!
        expect(ProvisionalUser.exists?(provisional_user.id)).to be false
      end

      it "does not destroy the real user's existing drawings" do
        existing = create(:drawing, user: real_user)
        migrator.migrate!
        expect(Drawing.exists?(existing.id)).to be true
      end
    end

    context "when the provisional user has no drawings" do
      it "destroys the provisional user" do
        migrator.migrate!
        expect(ProvisionalUser.exists?(provisional_user.id)).to be false
      end
    end

    context "when provisional_user is nil" do
      it "does not raise" do
        expect { described_class.new(nil, real_user).migrate! }.not_to raise_error
      end
    end

    context "when real_user is nil" do
      it "does not destroy the provisional user" do
        described_class.new(provisional_user, nil).migrate!
        expect(ProvisionalUser.exists?(provisional_user.id)).to be true
      end
    end
  end
end
