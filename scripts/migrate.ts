import mongoose from "mongoose";
import { Users, Advertisers, Ads, AdTasks, CompletedTasks } from "../data/mock";
import { User } from "../src/models/User";
import { Advertiser } from "../src/models/Advertisers";
import { Ad } from "../src/models/Ad";
import { AdTask } from "../src/models/AdTask";
import { CompletedTask } from "../src/models/CompletedTask";

async function migrate() {
  console.log("process.env.DB_URL", process.env.DB_URL);

  await mongoose.connect(process.env.DB_URL!, {
    useNewUrlParser: true,
    useCreateIndex: true
  });
  await clearAll();
  await updateUsers();
  await updateAdvertisers();
  await updateAds();
  await updateAdTasks();
  await updateCompletedTasks();
}

async function clearAll() {
  await User.deleteMany({}).exec();
  await Advertiser.deleteMany({}).exec();
  await Ad.deleteMany({}).exec();
  await AdTask.deleteMany({}).exec();
  await CompletedTask.deleteMany({}).exec();
}

async function updateUsers() {
  for (const user of Users) {
    const existingObj = await User.findOne({
      email: user.email
    });
    if (existingObj) {
      console.log(
        `Obj with email ${existingObj.email} already exists. Updating data.`
      );
      existingObj.name = user.name;
      //   existingObj.email = user.email;
      await existingObj.save();
    } else {
      console.log(`Obj with email ${user.email} is new. Inserting new league.`);
      const userDocument = new User({ ...user });
      await userDocument.save();
    }
  }
}

async function updateAdvertisers() {
  for (const advertiser of Advertisers) {
    const existingObj = await Advertiser.findOne({
      name: advertiser.name
    });
    if (existingObj) {
      console.log(
        `Obj with name ${existingObj.name} already exists. Updating data.`
      );
      existingObj.name = advertiser.name;
      existingObj.balance = advertiser.balance;
      await existingObj.save();
    } else {
      console.log(
        `Obj with name ${advertiser.name} is new. Inserting new league.`
      );
      const advertiserDocument = new Advertiser({ ...advertiser });
      await advertiserDocument.save();
    }
  }
}

async function updateAds() {
  const existingObj = await Advertiser.findOne({ name: Advertisers[0].name });

  for (const ad of Ads) {
    const adDocument = new Ad({
      ...ad,
      advertiser: existingObj!._id
    });
    await adDocument.save();
  }
}

async function updateAdTasks() {
  const existingAd = await Ad.findOne({ url: Ads[0].url });

  console.log("existingAd", existingAd);

  for (const adTask of AdTasks) {
    const adTaskDocument = new AdTask({
      ...adTask,
      ad: existingAd!._id
    });
    await adTaskDocument.save();
    // when creating a task, add it to ad's tasks array
    // let ad = await Ad.findOne({ _id: existingObj!._id }).exec();
    if (existingAd) {
      console.log("existingAd.tasks", existingAd.tasks);

      if (existingAd.tasks === undefined) {
        existingAd.tasks = [adTaskDocument._id];
      } else {
        console.log("existingAd", existingAd);

        existingAd.tasks.push(adTaskDocument._id);
      }
      existingAd.save();
    }
  }
}

async function updateCompletedTasks() {
  const existingObj1 = await AdTask.findOne({ title: AdTasks[0].title });
  const existingObj2 = await User.findOne({ name: Users[0].name });

  console.log("existingObj1", existingObj1);
  console.log("existingObj2", existingObj2);

  for (const completedTask of CompletedTasks) {
    const completedTaskDocument = new CompletedTask({
      ...completedTask,
      task: existingObj1!._id,
      user: existingObj2!._id
    });
    await completedTaskDocument.save();
  }
}

migrate()
  .then(() => {
    console.log("populated database");
    process.exit(0);
  })
  .catch(e => {
    console.log("error migrating database");
    console.log(e);
    process.exit(1);
  });
