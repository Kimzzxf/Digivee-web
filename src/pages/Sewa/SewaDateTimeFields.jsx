import DatePicker from "../../components/DatePicker";
import HourMinuteSelect from "../../components/HourMinuteSelect";
import { OPERATIONAL_HOURS, OPERATIONAL_END } from "../../lib/time";
import { todayStr } from "./sewaHelpers";

export default function SewaDateTimeFields({
  tanggalPickup, handlePickupChange, tanggalReturn, handleReturnChange,
  jamPickup, handleJamPickupChange, jamReturn, handleJamReturnChange,
  durasiKurangSehari, jamReturnDibatasi, jamPickupLocked, jamReturnLocked, bookedDates,
}) {
  return (
    <>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="font-mono text-xs font-bold block mb-1">
            Tanggal Pickup
          </label>
          <DatePicker
            value={tanggalPickup}
            min={todayStr()}
            bookedRanges={bookedDates}
            onChange={handlePickupChange}
          />
        </div>
        <div className="flex-1">
          <label className="font-mono text-xs font-bold block mb-1">
            Tanggal Return
          </label>
          <DatePicker
            value={tanggalReturn}
            min={tanggalPickup || todayStr()}
            bookedRanges={bookedDates}
            onChange={handleReturnChange}
            disabled={durasiKurangSehari}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="font-mono text-xs font-bold block mb-1">
            Jam Pickup
          </label>
          <HourMinuteSelect
            value={jamPickup}
            onChange={handleJamPickupChange}
            hours={OPERATIONAL_HOURS}
            max={OPERATIONAL_END}
            disabled={jamPickupLocked}
          />
        </div>
        <div className="flex-1">
          <label className="font-mono text-xs font-bold block mb-1">
            Jam Return
          </label>
          <HourMinuteSelect
            value={jamReturn}
            onChange={handleJamReturnChange}
            hours={OPERATIONAL_HOURS}
            min={jamReturnDibatasi ? jamPickup : undefined}
            max={OPERATIONAL_END}
            disabled={jamReturnLocked}
          />
        </div>
      </div>
      <p className="font-mono text-[10px] text-paper/60 -mt-2">
        Jam operasional COD Digivee: 09.00–20.00 WIB.
        {durasiKurangSehari &&
          " Durasi di bawah 1 hari — tanggal & jam return otomatis ikut pickup."}
        {!durasiKurangSehari && (jamPickupLocked || jamReturnLocked) &&
          " Jam yang dipilih duluan ngunci satunya biar sama."}
      </p>
    </>
  );
}
