import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  var image : ?Storage.ExternalBlob = null;

  public shared ({ caller }) func updateImage(blob : Storage.ExternalBlob) : async () {
    image := ?blob;
  };

  public query ({ caller }) func getImage() : async ?Storage.ExternalBlob {
    image;
  };
};
