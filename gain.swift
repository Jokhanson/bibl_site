import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count == 4 else {
    print("usage: gain <in> <out> <volume>")
    exit(1)
}

let inputPath = args[1]
let outputPath = args[2]
let volume = Float(args[3]) ?? 1.0

let asset = AVURLAsset(url: URL(fileURLWithPath: inputPath))
guard let session = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetAppleM4A) else {
    print("cannot create export session")
    exit(1)
}

if let track = asset.tracks(withMediaType: .audio).first {
    let mix = AVMutableAudioMix()
    let params = AVMutableAudioMixInputParameters(track: track)
    params.setVolume(volume, at: .zero)
    mix.inputParameters = [params]
    session.audioMix = mix
}

session.outputURL = URL(fileURLWithPath: outputPath)
session.outputFileType = .m4a

let semaphore = DispatchSemaphore(value: 0)
session.exportAsynchronously {
    switch session.status {
    case .completed:
        print("OK")
    case .failed:
        print("FAIL: \(session.error?.localizedDescription ?? "?")")
    default:
        print("STATUS: \(session.status.rawValue)")
    }
    semaphore.signal()
}
semaphore.wait()